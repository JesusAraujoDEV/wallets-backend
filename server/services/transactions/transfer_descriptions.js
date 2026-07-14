function buildTransferDescriptions({ fromAccount, toAccount, concept }) {
  const hasConcept = concept && concept.trim().length;
  const descOut = hasConcept
    ? `Transferencia a ${toAccount.name}: ${concept}`
    : `Transferencia a ${toAccount.name}`;
  const descIn = hasConcept
    ? `Transferencia desde ${fromAccount.name}: ${concept}`
    : `Transferencia desde ${fromAccount.name}`;
  const descFxGain = hasConcept
    ? `Ganancia cambiaria (${fromAccount.currency}->${toAccount.currency}) desde ${fromAccount.name}: ${concept}`
    : `Ganancia cambiaria (${fromAccount.currency}->${toAccount.currency}) desde ${fromAccount.name}`;
  const descFxLoss = hasConcept
    ? `Pérdida cambiaria (${fromAccount.currency}->${toAccount.currency}) desde ${fromAccount.name}: ${concept}`
    : `Pérdida cambiaria (${fromAccount.currency}->${toAccount.currency}) desde ${fromAccount.name}`;
  const descCom = `Comision de la transferencia de la cuenta ${fromAccount.name} a la cuenta ${toAccount.name} con concepto de: "${concept || ''}"`;

  return { descOut, descIn, descFxGain, descFxLoss, descCom };
}

module.exports = { buildTransferDescriptions };
