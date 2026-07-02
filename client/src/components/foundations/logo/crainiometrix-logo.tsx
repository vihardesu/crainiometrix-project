"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";
import { CrainiometrixLogoMinimal } from "./crainiometrix-logo-minimal";

export const CrainiometrixLogo = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("flex h-8 w-max items-center gap-2.5", props.className)}>
            <CrainiometrixLogoMinimal className="size-7 shrink-0" />
            <span className="font-display text-lg font-semibold tracking-tight text-primary">Crainiometrix</span>
        </div>
    );
};
