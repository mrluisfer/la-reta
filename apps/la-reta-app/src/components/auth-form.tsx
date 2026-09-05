import { useSignIn, useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GoogleButton } from "@/components/auth/google-button";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { GlassSurface } from "@/components/ui/glass-surface";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Radius, Spacing } from "@/constants/theme";
import { API_URL } from "@/lib/api";
import { authErrorMessage, globalErrorMessage } from "@/lib/auth-errors";
import { closeOverlay } from "@/lib/navigation";

/**
 * Alta y acceso, contra la misma instancia de Clerk que la web.
 *
 * Sobre la API: `@clerk/expo` v4 usa el modelo de señales
 * (`useSignIn()` → `{ signIn, errors, fetchStatus }`) con métodos por factor
 * —`signIn.password()`, `signUp.verifications.verifyEmailCode()`— que
 * **resuelven con `{ error }` en vez de lanzar**. Por eso no hay try/catch
 * alrededor: se comprueba el `error` devuelto. El encadenado antiguo
 * (`create()` + `prepareFirstFactor()` + `setActive()`) vive en
 * `@clerk/expo/legacy` y no se usa para código nuevo.
 *
 * Google va por SSO de navegador y no por el flujo nativo: es lo único que
 * funciona en Expo Go, donde se prueba esto a diario.
 *
 * La instancia pide correo verificado por código, así que el alta tiene dos
 * pasos y el segundo vive en esta misma pantalla.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_LENGTH = 6;
/** Mínimo de Clerk para esta instancia. Se comprueba aquí para no gastar una
 *  ida y vuelta en decir lo que ya se sabe antes de salir del teléfono. */
const MIN_PASSWORD = 6;

export type AuthMode = "sign-in" | "sign-up";

const COPY = {
  "sign-in": {
    eyebrow: "Bienvenido de vuelta",
    title: "Entra a tu reta",
    lead: "Tu plantilla, tus partidos y tus votaciones, donde los dejaste.",
    submit: "Iniciar sesión",
    switchText: "¿Todavía no tienes cuenta?",
    switchAction: "Crear una",
  },
  "sign-up": {
    eyebrow: "Nuevo por aquí",
    title: "Crea tu cuenta",
    lead: "Ficha tuya, votaciones y el historial de la reta en tu bolsillo.",
    submit: "Crear cuenta",
    switchText: "¿Ya tienes cuenta?",
    switchAction: "Iniciar sesión",
  },
} as const;

type Step = "credentials" | "code";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const copy = COPY[mode];

  const {
    signIn,
    errors: signInErrors,
    fetchStatus: signInFetch,
  } = useSignIn();
  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpFetch,
  } = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("credentials");
  const [localError, setLocalError] = useState<string | null>(null);
  /**
   * Lo que falta, por campo.
   *
   * Antes todo caía en un aviso general arriba del todo: en un teléfono
   * pequeño quedaba fuera de pantalla, así que tocar "Iniciar sesión" parecía
   * no hacer nada. Ahora el campo se pinta en rojo y dice qué le pasa, que es
   * donde el ojo ya está mirando.
   */
  const [localFields, setLocalFields] = useState<{
    email?: string;
    password?: string;
    terms?: string;
  }>({});

  /**
   * Los dos consentimientos del alta, separados a propósito.
   *
   * Aceptar las condiciones es obligatorio y se manda a Clerk en su campo
   * propio (`legalAccepted`), que es para lo que existe. El boletín es opcional
   * y va a los metadatos de la cuenta: es una preferencia del usuario, no un
   * requisito para entrar, y mezclar las dos casillas en una sola —"acepto todo
   * y además quiero correos"— es exactamente lo que la ley llama consentimiento
   * no informado.
   */
  const [terms, setTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  const busy = (mode === "sign-in" ? signInFetch : signUpFetch) === "fetching";

  const done = () => router.replace("/inicio");

  const submitCredentials = async () => {
    setLocalError(null);

    // Se juntan todos los fallos y se enseñan a la vez: arreglar el correo para
    // que entonces te digan lo de la contraseña es la forma más rápida de que
    // alguien abandone.
    const missing: {
      email?: string;
      password?: string;
      terms?: string;
    } = {};
    if (email.trim().length === 0) {
      missing.email = "Escribe tu correo.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      missing.email = "Ese correo no se ve bien.";
    }
    if (password.length === 0) {
      missing.password = "Escribe tu contraseña.";
    } else if (mode === "sign-up" && password.length < MIN_PASSWORD) {
      missing.password = `Al menos ${MIN_PASSWORD} caracteres.`;
    }
    if (mode === "sign-up" && !terms) {
      missing.terms = "Hay que aceptar las condiciones para crear la cuenta.";
    }

    setLocalFields(missing);
    if (Object.keys(missing).length > 0) return;

    if (mode === "sign-in") {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (error) return;

      if (signIn.status === "complete") {
        await signIn.finalize();
        done();
        return;
      }
      // Verificación de dispositivo nuevo: Clerk manda un código al correo y se
      // reutiliza el mismo paso que el alta para pedirlo.
      if (signIn.status === "needs_client_trust") {
        await signIn.mfa.sendEmailCode();
        setStep("code");
        return;
      }
      setLocalError(
        "Esta cuenta pide un paso extra que la app todavía no cubre. Entra desde la web."
      );
      return;
    }

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
      firstName: name.trim() || undefined,
      legalAccepted: terms,
      unsafeMetadata: { newsletter },
    });
    if (error) return;

    if (signUp.status === "complete") {
      await signUp.finalize();
      done();
      return;
    }
    if (signUp.unverifiedFields.includes("email_address")) {
      await signUp.verifications.sendEmailCode();
      setStep("code");
      return;
    }
    setLocalError("Falta algún dato que la app todavía no pide.");
  };

  const submitCode = async () => {
    setLocalError(null);

    if (mode === "sign-in") {
      const { error } = await signIn.mfa.verifyEmailCode({ code });
      if (error) return;
      if (signIn.status === "complete") {
        await signIn.finalize();
        done();
      }
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;
    if (signUp.status === "complete") {
      await signUp.finalize();
      done();
    }
  };

  const resend = async () => {
    setLocalError(null);
    if (mode === "sign-in") {
      await signIn.mfa.sendEmailCode();
    } else {
      await signUp.verifications.sendEmailCode();
    }
  };

  const startOver = async () => {
    setCode("");
    setStep("credentials");
    setLocalError(null);
    await (mode === "sign-in" ? signIn.reset() : signUp.reset());
  };

  const errors = mode === "sign-in" ? signInErrors : signUpErrors;
  const globalError =
    localError ?? globalErrorMessage(errors.global ?? undefined);
  const emailError = authErrorMessage(
    mode === "sign-in"
      ? signInErrors.fields.identifier
      : signUpErrors.fields.emailAddress
  );
  const passwordError = authErrorMessage(errors.fields.password);
  const codeError = authErrorMessage(errors.fields.code);
  const captchaError = authErrorMessage(signUpErrors.fields.captcha);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: Palette.paper }}
    >
      <ScrollView
        contentContainerStyle={{
          alignSelf: "center",
          width: "100%",
          maxWidth: MaxContentWidth,
          gap: Spacing.five,
          paddingHorizontal: Spacing.four,
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + Spacing.five,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "flex-start" }}>
          <GlassSurface
            isInteractive
            style={{ borderRadius: Radius.pill, overflow: "hidden" }}
          >
            <Button
              icon="close"
              label="Cerrar"
              onPress={() => closeOverlay(router, "/")}
              size="md"
              variant="plain"
            />
          </GlassSurface>
        </View>

        <View style={{ gap: Spacing.two }}>
          <Text tone="accent" variant="eyebrow">
            {step === "code" ? "Último paso" : copy.eyebrow}
          </Text>
          <Text variant="display">
            {step === "code" ? "Revisa tu correo" : copy.title}
          </Text>
          <Text tone="muted" variant="body">
            {step === "code"
              ? `Mandamos un código de ${CODE_LENGTH} dígitos a ${email.trim()}.`
              : copy.lead}
          </Text>
        </View>

        {step === "code" ? (
          <View style={{ gap: Spacing.three }}>
            <Field
              autoComplete="one-time-code"
              error={codeError}
              inputMode="numeric"
              keyboardType="number-pad"
              label="Código"
              maxLength={CODE_LENGTH}
              onChangeText={setCode}
              onSubmitEditing={submitCode}
              placeholder="000000"
              returnKeyType="go"
              value={code}
            />

            {globalError === undefined ? null : (
              <Notice detail={globalError} title="No pudimos continuar" />
            )}

            <Button
              disabled={code.length < CODE_LENGTH}
              label="Verificar"
              loading={busy}
              onPress={submitCode}
              variant="primary"
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: Spacing.two,
              }}
            >
              <Button
                label="Reenviar código"
                onPress={resend}
                size="md"
                variant="plain"
              />
              <Button
                label="Cambiar correo"
                onPress={startOver}
                size="md"
                variant="plain"
              />
            </View>
          </View>
        ) : (
          <>
            <View style={{ gap: Spacing.three }}>
              {/* Con Google el alta no pasa por el formulario, así que las
                  condiciones se comprueban aquí también: si no, entrar por ese
                  botón sería la forma de saltárselas. */}
              <GoogleButton
                newsletter={newsletter}
                onError={setLocalError}
                onBlocked={() =>
                  setLocalFields((current) => ({
                    ...current,
                    terms:
                      "Hay que aceptar las condiciones para crear la cuenta.",
                  }))
                }
                requireTerms={mode === "sign-up" && !terms}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.three,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: Palette.hairline,
                  }}
                />
                <Text tone="faint" variant="eyebrow">
                  o con tu correo
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: Palette.hairline,
                  }}
                />
              </View>
            </View>

            <View style={{ gap: Spacing.three }}>
              {mode === "sign-up" ? (
                <Field
                  autoCapitalize="words"
                  autoComplete="name"
                  label="Cómo te dicen"
                  onChangeText={setName}
                  placeholder="Chato"
                  returnKeyType="next"
                  value={name}
                />
              ) : null}

              <Field
                autoCapitalize="none"
                autoComplete="email"
                error={localFields.email ?? emailError}
                inputMode="email"
                keyboardType="email-address"
                label="Correo"
                onChangeText={(value) => {
                  setEmail(value);
                  setLocalFields((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }}
                placeholder="tu@correo.com"
                returnKeyType="next"
                value={email}
              />

              <Field
                autoCapitalize="none"
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                error={localFields.password ?? passwordError}
                label={
                  mode === "sign-up"
                    ? `Contraseña (mínimo ${MIN_PASSWORD})`
                    : "Contraseña"
                }
                onChangeText={(value) => {
                  setPassword(value);
                  setLocalFields((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }}
                onSubmitEditing={submitCredentials}
                placeholder="Tu contraseña"
                returnKeyType="go"
                secureTextEntry
                value={password}
              />
            </View>

            {mode === "sign-up" ? (
              <View style={{ gap: Spacing.three }}>
                <Checkbox
                  checked={terms}
                  error={localFields.terms}
                  label={
                    <Text tone="muted" variant="caption">
                      Acepto las{" "}
                      <Text
                        onPress={() =>
                          WebBrowser.openBrowserAsync(`${API_URL}/legal`)
                        }
                        tone="accent"
                        variant="caption"
                      >
                        condiciones y el aviso de privacidad
                      </Text>
                      .
                    </Text>
                  }
                  onChange={(next) => {
                    setTerms(next);
                    setLocalFields((current) => ({
                      ...current,
                      terms: undefined,
                    }));
                  }}
                />

                <Checkbox
                  checked={newsletter}
                  label={
                    <Text tone="muted" variant="caption">
                      Quiero enterarme de lo nuevo de la app y de la reta.
                      Opcional, y se puede quitar después.
                    </Text>
                  }
                  onChange={setNewsletter}
                />
              </View>
            ) : null}

            <View style={{ gap: Spacing.three }}>
              {/* El aviso va justo encima del botón que lo provoca. Arriba del
                  todo se quedaba fuera de pantalla en un teléfono pequeño, y
                  entonces tocar "Iniciar sesión" parecía no hacer nada. */}
              {globalError === undefined ? null : (
                <Notice detail={globalError} title="No pudimos continuar" />
              )}

              <Button
                label={copy.submit}
                loading={busy}
                onPress={submitCredentials}
                variant="primary"
              />

              {captchaError === undefined ? null : (
                <Text tone="danger" variant="caption">
                  {captchaError}
                </Text>
              )}

              {/* La frase entera es el objetivo, no solo las dos palabras del
                  final: en un teléfono pequeño el pulgar cae sobre "¿Todavía no
                  tienes cuenta?" y espera que pase algo. De paso desaparece el
                  relleno del botón, que descuadraba la línea. */}
              <Pressable
                accessibilityLabel={`${copy.switchText} ${copy.switchAction}`}
                accessibilityRole="button"
                onPress={() =>
                  router.replace(mode === "sign-in" ? "/sign-up" : "/sign-in")
                }
                style={({ pressed }) => ({
                  alignSelf: "center",
                  paddingVertical: Spacing.two,
                  paddingHorizontal: Spacing.three,
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Text variant="caption">
                  <Text tone="muted" variant="caption">
                    {copy.switchText}{" "}
                  </Text>
                  <Text tone="accent" variant="caption">
                    {copy.switchAction}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/*
          Punto de montaje del bot protection de Clerk. Está activo en esta
          instancia ("smart"), y sin este nodo el alta falla con captcha_invalid.
          No dibuja nada mientras no haga falta.
        */}
        <View nativeID="clerk-captcha" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
