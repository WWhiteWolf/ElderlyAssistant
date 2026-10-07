// Where a held row lands on a reminder list.
//
// A row's place is where it sits in the list. That does not change when
// the list scrolls. The finger's place on the screen is shifted by how
// far the list has scrolled, so the two can be compared.

export function placeInList(fingerY: number, listTop: number, scrolled: number): number {
    return fingerY - listTop + scrolled;
}

export function rowUnderPlace(place: number, rows: { y: number; h: number }[]): number {
    let best = 0;
    let bestDistance = Infinity;
    rows.forEach((row, index) => {
        const middle = row.y + row.h / 2;
        const distance = (middle - place) ** 2;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
        }
    });
    return best;
}
