"use client";

import { useActionState } from "react";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { DEMO_CREDENTIALS_HINT } from "@/lib/auth/demo-users";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = {};

export function LoginForm() {
    const [state, formAction, isPending] = useActionState(login, initialState);

    return (
        <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
                <UntitledLogo className="h-8" />
            </div>

            <div className="rounded-2xl bg-primary p-8 shadow-xs ring-1 ring-secondary">
                <div className="mb-6">
                    <h1 className="text-display-xs font-semibold text-primary">Sign in</h1>
                    <p className="mt-1 text-sm text-tertiary">Care navigator demo access</p>
                </div>

                <form action={formAction} className="flex flex-col gap-5">
                    <Input
                        isRequired
                        name="email"
                        type="email"
                        label="Email"
                        placeholder="navigator@crainiometrix.local"
                        autoComplete="email"
                    />

                    <Input
                        isRequired
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                    />

                    {state.error && <p className="text-sm text-error-primary">{state.error}</p>}

                    <Button type="submit" color="primary" size="lg" isDisabled={isPending}>
                        {isPending ? "Signing in..." : "Sign in"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-tertiary">
                    Demo credentials:{" "}
                    <span className="font-medium text-secondary">
                        {DEMO_CREDENTIALS_HINT.email} / {DEMO_CREDENTIALS_HINT.password}
                    </span>
                </p>
            </div>
        </div>
    );
}
