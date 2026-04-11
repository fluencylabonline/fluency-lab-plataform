import { CSSProperties } from "react";

export const emailStyles = {
  main: {
    backgroundColor: "#f6f9fc",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  } as CSSProperties,
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "600px",
    borderRadius: "8px",
  } as CSSProperties,
  header: {
    textAlign: "center" as const,
    marginBottom: "32px",
  } as CSSProperties,
  logo: {
    height: "40px",
    margin: "0 auto",
  } as CSSProperties,
  heading: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center" as const,
    marginBottom: "24px",
  } as CSSProperties,
  paragraph: {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#484848",
    margin: "16px 0",
  } as CSSProperties,
  footerParagraph: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "#8898aa",
    margin: "32px 0 0",
    textAlign: "center" as const,
  } as CSSProperties,
  buttonSection: {
    textAlign: "center" as const,
    marginTop: "32px",
  } as CSSProperties,
  button: {
    backgroundColor: "#007bff",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
  } as CSSProperties,
};
