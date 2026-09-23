# Next.js como API desta fase

O plano mestre recomenda NestJS quando existir cliente móvel ou fila própria. Nesta fase o produto é um site. As mutações ficam em Route Handlers, com a sessão conferida na função que lê o banco.

A API sai deste processo quando um app Expo ou um worker precisar de contrato estável. Até lá, os módulos em `src/server` e `src/domain` são o limite: identidade, perfil, lote, conversa, encontro, segurança, pagamento simulado e auditoria.
