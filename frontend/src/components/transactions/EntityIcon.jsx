import { iconMap } from "@/lib/icons";

export function EntityIcon({ name, className = "h-4 w-4 shrink-0" }) {
    const Icon = name ? iconMap[name] : null;

    if (!Icon) {
        return null;
    }

    return <Icon className={className} aria-hidden="true" />;
}