import { InfoIcon } from './InfoIcon';

interface WidgetHeadingProps {
  title: string;
  /** Optional tooltip for the info icon. If omitted, no icon is shown. */
  infoText?: string;
}

export function WidgetHeading({ title, infoText }: WidgetHeadingProps) {
  return (
    <h2 className="widget-title heading-with-info">
      {title}
      {infoText != null && <InfoIcon text={infoText} />}
    </h2>
  );
}
