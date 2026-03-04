import { Resend } from 'resend'

interface ReservationEmailData {
  to: string
  userName: string
  reservationId: string
  items: { nom: string; equipement: string }[]
  startDate: string
  endDate: string
}

export async function sendConfirmationEmail(data: ReservationEmailData) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const itemsList = data.items
    .map((item) => `- ${item.nom} — ${item.equipement}`)
    .join('\n')

  return resend.emails.send({
    from: 'Edulab Réservations <noreply@edulab.fr>',
    to: data.to,
    subject: `Confirmation de réservation #${data.reservationId.slice(0, 8)}`,
    text: `
Bonjour ${data.userName},

Votre réservation a bien été enregistrée.

Équipements réservés :
${itemsList}

Période : du ${data.startDate} au ${data.endDate}
Référence : ${data.reservationId}

Merci de retourner les équipements à la date prévue.

— L'équipe Edulab
    `.trim(),
  })
}

export async function sendReminderEmail(data: ReservationEmailData) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const itemsList = data.items
    .map((item) => `- ${item.nom} — ${item.equipement}`)
    .join('\n')

  return resend.emails.send({
    from: 'Edulab Réservations <noreply@edulab.fr>',
    to: data.to,
    subject: `Rappel : retour d'équipement aujourd'hui`,
    text: `
Bonjour ${data.userName},

Votre emprunt prend fin aujourd'hui (${data.endDate}). Merci de retourner les équipements suivants :

${itemsList}

Référence réservation : ${data.reservationId}

— L'équipe Edulab
    `.trim(),
  })
}
