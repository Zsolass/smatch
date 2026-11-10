import { Icon } from "@/components/ui/Icon";
import { clinic, hasMultipleLocations, type ClinicLocation } from "@/config/clinic";

function Location({ loc }: { loc: ClinicLocation }) {
  return (
    <div>
      {hasMultipleLocations && <h3 className="display mb-4 text-2xl text-ink">{loc.name}</h3>}
      <dl className="grid gap-5 text-[0.9375rem]">
        <div className="flex gap-4">
          <dt className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="phone" />
            <span className="sr-only">Phone</span>
          </dt>
          <dd className="self-center">
            <a href={loc.phoneHref} className="text-lg font-semibold text-ink hover:text-accent" data-analytics="call_click" data-placement="contact">
              <span className="sr-only">Call </span>
              {loc.phone}
            </a>
            <a href={`mailto:${loc.email}`} className="block break-all text-ink-soft hover:text-ink">
              {loc.email}
            </a>
          </dd>
        </div>
        <div className="flex gap-4">
          <dt className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="pin" />
            <span className="sr-only">Address</span>
          </dt>
          <dd className="self-center text-ink">
            {loc.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            {loc.parking && <span className="mt-1 block text-ink-soft">{loc.parking}</span>}
            {loc.directionsUrl && (
              <a href={loc.directionsUrl} target="_blank" rel="noopener" className="mt-1 inline-block font-semibold text-accent underline underline-offset-2">
                Get directions<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </dd>
        </div>
        <div className="flex gap-4">
          <dt className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="clock" />
            <span className="sr-only">Opening hours</span>
          </dt>
          <dd className="flex-1">
            <table className="w-full max-w-xs">
              <caption className="sr-only">Opening hours</caption>
              <tbody>
                {loc.hours.map((h) => (
                  <tr key={h.days}>
                    <th scope="row" className="py-0.5 pr-4 text-left font-normal text-ink-soft">
                      {h.days}
                    </th>
                    <td className="py-0.5 text-right whitespace-nowrap text-ink">{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Phone, address, parking, directions and opening hours for each of the clinic's locations. */
export function LocationDetails() {
  return (
    <div className="grid gap-10">
      {clinic.locations.map((loc) => (
        <Location key={loc.id} loc={loc} />
      ))}
    </div>
  );
}
