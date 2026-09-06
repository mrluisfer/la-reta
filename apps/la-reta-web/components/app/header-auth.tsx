import { ButtonVariant } from "@/shared/types";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { LogInIcon, UserRoundPlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

/** One auth CTA: a Clerk modal trigger styled as a tooltip'd button. */
const AuthAction = ({
  wrapper: Wrapper,
  icon,
  label,
  variant,
  tooltip,
}: {
  readonly wrapper: typeof SignInButton;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly variant: ButtonVariant;
  readonly tooltip: string;
}) => {
  return (
    <Tooltip>
      <Wrapper mode="modal">
        {/* En móvil el botón se queda solo con el icono: sin aria-label un
            lector de pantalla lo anunciaría como "botón" a secas. */}
        <TooltipTrigger
          render={<Button variant={variant} aria-label={label} />}
        >
          {icon}
          <span className="hidden md:inline-flex">{label}</span>
        </TooltipTrigger>
      </Wrapper>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

/**
 * Solo los CTA de sesión cerrada: la cuenta iniciada vive en el pie del sidebar
 * (`NavUser`). Entrar tiene que verse sin abrir nada; gestionar la cuenta no.
 */
export const HeaderAuth = () => {
  return (
    <Show when="signed-out">
      <>
        <AuthAction
          wrapper={SignInButton}
          icon={<LogInIcon />}
          label="Iniciar sesión"
          variant="secondary"
          tooltip="Inicia sesión para acceder a todas las funciones"
        />
        <AuthAction
          wrapper={SignUpButton}
          icon={<UserRoundPlusIcon />}
          label="Crear cuenta"
          variant="default"
          tooltip="Crea una cuenta para acceder a todas las funciones"
        />
      </>
    </Show>
  );
};
