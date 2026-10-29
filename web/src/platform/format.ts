export const fullName = (e: { firstName: string; lastName: string }) => `${e.firstName} ${e.lastName}`

/** Fecha de hoy en Colombia (UTC-5) como 'YYYY-MM-DD'. */
export const today = () => new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10)

/** Fecha-hora local de Colombia como 'YYYY-MM-DDTHH:MM:SS'. */
export const nowLocal = () => new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 19)
