export type AddressSuggestion = {
  street: string
  city: string
  region: string
  postalCode: string
  country: 'US' | 'CA' | 'GB' | 'AU' | 'DE'
}

// Local, dependency-free autocomplete dataset (no external geo API).
export const ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  {
    street: '350 Fifth Avenue',
    city: 'New York',
    region: 'NY',
    postalCode: '10118',
    country: 'US',
  },
  {
    street: '1 Infinite Loop',
    city: 'Cupertino',
    region: 'CA',
    postalCode: '95014',
    country: 'US',
  },
  { street: '233 S Wacker Dr', city: 'Chicago', region: 'IL', postalCode: '60606', country: 'US' },
  { street: '400 Broad St', city: 'Seattle', region: 'WA', postalCode: '98109', country: 'US' },
  {
    street: '1600 Amphitheatre Pkwy',
    city: 'Mountain View',
    region: 'CA',
    postalCode: '94043',
    country: 'US',
  },
  {
    street: '221B Baker Street',
    city: 'London',
    region: 'England',
    postalCode: 'NW1 6XE',
    country: 'GB',
  },
  {
    street: '10 Downing Street',
    city: 'London',
    region: 'England',
    postalCode: 'SW1A 2AA',
    country: 'GB',
  },
  { street: '100 Queen St W', city: 'Toronto', region: 'ON', postalCode: 'M5H 2N2', country: 'CA' },
  {
    street: '1055 W Georgia St',
    city: 'Vancouver',
    region: 'BC',
    postalCode: 'V6E 3P3',
    country: 'CA',
  },
  { street: '1 Macquarie Place', city: 'Sydney', region: 'NSW', postalCode: '2000', country: 'AU' },
  {
    street: 'Pariser Platz 1',
    city: 'Berlin',
    region: 'Berlin',
    postalCode: '10117',
    country: 'DE',
  },
  {
    street: 'Marienplatz 8',
    city: 'Munich',
    region: 'Bavaria',
    postalCode: '80331',
    country: 'DE',
  },
]

export function searchAddresses(query: string): AddressSuggestion[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return ADDRESS_SUGGESTIONS.filter((entry) =>
    `${entry.street} ${entry.city} ${entry.region} ${entry.postalCode}`.toLowerCase().includes(q),
  ).slice(0, 5)
}
