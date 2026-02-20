import { InfoIcon } from './InfoIcon';

interface SectionHeadingProps {
  title: string;
  /** Optional tooltip text for the info icon. If omitted, no icon is shown. */
  infoText?: string;
}

export function SectionHeading({ title, infoText }: SectionHeadingProps) {
  return (
    <h2 className="section-title heading-with-info">
      {title}
      {infoText != null && <InfoIcon text={infoText} />}
    </h2>
  );
}
