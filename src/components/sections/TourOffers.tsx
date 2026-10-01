import { useLocale, useTranslations } from "next-intl";
import { tourPrice, formatEuro, type Tour } from "@/config/tours";
import { ButtonLink, Heading } from "@/components/ui";
import { Link } from "@/i18n/navigation";

export function TourOffers({ tour }: { tour: Tour }) {
  const t = useTranslations("offers");
  const ui = useTranslations("tourExplorer");
  const locale = useLocale();
  const cell = "border-b border-[var(--color-border)] px-3 py-3 text-start";
  const sizes = [1, 2, 3, 4, 5, 6, 10];
  const calendar = useTranslations("calendarBooking");
  return (
    <section className="mt-12 border-t border-[var(--color-border)] pt-9" aria-labelledby="selected-tour-pricing">
      <Heading as="h3"><span id="selected-tour-pricing">{ui("timesAndPrices")}</span></Heading>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 text-[15px] leading-relaxed">
          {tour.key === "architecture" ? (
            <>{["languages", "departure", "booking", "price", "meeting", "arrival"].map((detail) => <p key={detail}>{t(`architecture.${detail}`)}</p>)}</>
          ) : <><p>{t(tour.private ? "privateSchedule" : "sharedSchedule")}</p><p>{t("meeting")}</p></>}
          {!tour.private && <p>{t("minimum")}</p>}
          {tour.private && <Link href="/contact" className="inline-block py-3 font-semibold text-[var(--color-link)] underline">{t("contact")}</Link>}
        </div>
        {!tour.private ? <div className="space-y-4 rounded-xl bg-[var(--color-brand-sand)] p-6"><p className="font-semibold">{calendar("english")}</p><p>{calendar("englishPrice")}</p><p className="border-t border-[var(--color-border)] pt-4 font-semibold">{calendar("dutch")}</p><p>{calendar("dutchPrice")}</p><p className="text-sm">{t("sharedPriceNote")}</p></div> : <table className="w-full self-start text-sm sm:text-base">
          <caption className="pb-3 text-start text-sm leading-relaxed">{t(tour.private ? "privatePriceNote" : "sharedPriceNote")}</caption>
          <thead><tr><th scope="col" className={cell}>{t("people")}</th>{tour.private && <th scope="col" className={cell}>{t("price")}</th>}<th scope="col" className={cell}>{t("perPerson")}</th></tr></thead>
          <tbody>{sizes.map((people, i) => {
            const price = tourPrice(tour, people)!;
            return <tr key={people}><th scope="row" className={cell}>{tour.private ? people : ["1", "2", "3–5", "6+"][i]}</th>{tour.private && <td className={cell}>{formatEuro(price.totalCents, locale)}</td>}<td className={cell}>{formatEuro(price.perPersonCents, locale)}</td></tr>;
          })}</tbody>
        </table>}
      </div>
      <div className="mt-7"><ButtonLink href={{ pathname: "/book", query: { tour: tour.id } }}>{t(`${tour.key}.cta`)}</ButtonLink></div>
    </section>
  );
}
