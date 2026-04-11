import * as React from "react";
import { Button } from "@react-email/components";
import { emailStyles } from "../email-styles";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export const EmailButton: React.FC<EmailButtonProps> = ({ href, children }) => {
  return (
    <Button
      style={emailStyles.button}
      href={href}
    >
      {children}
    </Button>
  );
};
