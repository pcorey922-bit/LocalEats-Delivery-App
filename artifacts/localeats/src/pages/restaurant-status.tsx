import { useQuery } from '@tanstack/react-query';
import { customFetch } from '../../../../lib/api-client-react/src/custom-fetch';

type Availability = {
  acceptingOrders: boolean;
  capacityAvailable: boolean;
  isOpen: boolean;
  timezone: string;
  hours: Array<{ weekday: number; openTime: string | null; closeTime: string | null; isClosed: boolean }>;
};
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function time(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 && hour < 24 ? 'PM' : 'AM'}`;
}

export function RestaurantStatus({ restaurantId }: { restaurantId: string }) {
  const state = useQuery({
    queryKey: ['restaurant-availability', restaurantId],
    queryFn: () => customFetch<Availability>(`/api/restaurants/${restaurantId}/availability`),
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });
  const availability = state.data;
  const message = !availability ? 'Checking restaurant availability…'
    : !availability.acceptingOrders ? 'This restaurant has paused new orders.'
    : !availability.capacityAvailable ? 'This restaurant is at capacity. Please check back soon.'
    : !availability.isOpen ? 'This restaurant is outside its ordering hours.'
    : 'This restaurant is within its ordering hours.';
  return <section className="roco-card" aria-label="Restaurant availability">
    <h2>Restaurant availability</h2>
    {state.isError ? <p role="alert">Availability could not be checked. <button className="roco-button" onClick={() => void state.refetch()}>Retry availability</button></p>
      : <p role="status">{message}</p>}
    <p>You can browse and save items to your cart. Checkout rechecks hours, stock and capacity; RoCoEats ordering must also be open.</p>
    {availability?.hours?.length ? <details>
      <summary>Weekly hours ({availability.timezone})</summary>
      <dl>{days.map((day, weekday) => {
        const entries = availability.hours.filter((h): h is typeof h & { openTime: string; closeTime: string } => h.weekday === weekday && !h.isClosed && !!h.openTime && !!h.closeTime);
        return <div className="roco-row" key={day}><dt>{day}</dt><dd>{entries.length ? entries.map(h => `${time(h.openTime)} – ${time(h.closeTime)}${h.closeTime.startsWith('24:') || h.closeTime <= h.openTime ? ' (next day)' : ''}`).join(', ') : 'Closed'}</dd></div>;
      })}</dl>
    </details> : null}
  </section>;
}
