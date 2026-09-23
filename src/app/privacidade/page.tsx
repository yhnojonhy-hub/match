import { Shell } from "@/components/Shell";

export default function PrivacyPage() {
  return (
    <Shell>
      <h1>O que este banco guarda</h1>
      <p>
        Este site guarda conta, perfil, preferências, lote do dia, sinais, conversas, bloqueios, denúncias e o plano
        simulado. A localização fica numa célula de bairro. Latitude não é armazenada. A conferência de idade guarda
        método, resultado e data, e nesta versão o método é simulado.
      </p>
      <p>Apagar a conta remove a sessão e o texto das suas mensagens neste produto.</p>
    </Shell>
  );
}
