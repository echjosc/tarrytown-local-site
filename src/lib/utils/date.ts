/*
	@param targetDay - The day of the week to get the next date for (0 = Sunday, 6 = Saturday)
	@returns The next date for the target day
*/
export function getNextDate(targetDay: number) {
	const today = new Date();
	const todayDay = today.getDay(); // 0 (Sun) - 6 (Sat)

	// Days to add to reach the *next* Saturday (not counting today)
	let daysUntilNextDate = (targetDay - todayDay + 7) % 7;
	if (daysUntilNextDate === 0) daysUntilNextDate = 7; // today is Saturday → go to next week

	const nextDate = new Date(today);
	nextDate.setDate(today.getDate() + daysUntilNextDate);
	return nextDate;
}