/** The text "extracted" from any uploaded PDF in mock mode. */
export const extractedCvText = `Olena Hnatiuk
Kyiv, Ukraine · olena.hnatiuk@example.com · github.com/olena-h

Senior Backend Engineer, Fintory (2021 – present)
- Built the payments API on Node.js and PostgreSQL for 40 partner banks
- Moved card authorisations to an outbox pattern
- Mentored three junior engineers

Backend Engineer, Kyivstar Digital (2018 – 2021)
- Wrote the billing export service in TypeScript
- Cut the nightly report job from 3 hours to 20 minutes

Education: BSc in Computer Science, Igor Sikorsky Kyiv Polytechnic Institute, 2014 – 2018
Certificate: AWS Certified Developer – Associate, 2022
Skills: Node.js, TypeScript, PostgreSQL, Redis, Docker
Languages: Ukrainian (native), English`

/** A dense PDF: the same CV written out over and over, past the 20 000 characters of a source. */
export const longCvText = Array.from(
  { length: 30 },
  (_, page) => `Page ${page + 1}\n${extractedCvText}`,
).join('\n\n')

/** A PDF with little text in it: over the 50 characters the upload needs, under the form's 80. */
export const shortCvText = 'Olena Hnatiuk\nBackend engineer, Kyiv\nolena@example.com'
