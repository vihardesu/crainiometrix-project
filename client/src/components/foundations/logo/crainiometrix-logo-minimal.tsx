"use client";

import type { SVGProps } from "react";
import { cx } from "@/utils/cx";

export const CrainiometrixLogoMinimal = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg viewBox="0 0 32 32" fill="none" {...props} className={cx("size-8", props.className)}>
            <rect width="32" height="32" rx="8" className="fill-bg-brand-solid" />
            <path
                d="M10.5 11.5C10.5 10.1193 11.6193 9 13 9H19C20.3807 9 21.5 10.1193 21.5 11.5V20.5C21.5 21.8807 20.3807 23 19 23H13C11.6193 23 10.5 21.8807 10.5 20.5V11.5Z"
                className="stroke-white"
                strokeWidth="1.5"
            />
            <path
                d="M16 12.5V20.5M12.75 14.75H19.25M12.75 18.25H19.25"
                className="stroke-white"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
};
