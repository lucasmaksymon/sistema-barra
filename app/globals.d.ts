// Suprimir warnings de hidratación de extensiones del navegador
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLDivElement> & {
          bis_skin_checked?: string;
        },
        HTMLDivElement
      >;
    }
  }
}

export {};
