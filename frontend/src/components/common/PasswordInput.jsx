import {
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
    InputGroupButton,
} from "@/components/ui/input-group";

import { Eye, EyeOff } from "lucide-react";

import { usePreferences } from "@/context/PreferencesContext";

import { useState } from "react";

export default function PasswordInput(props) {
    const { t } = usePreferences();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <InputGroup>
            <InputGroupInput
                {...props}
                type={showPassword ? "text" : "password"}
            ></InputGroupInput>
            <InputGroupAddon align="inline-end">
                <InputGroupButton
                    variant="ghost"
                    type="button"
                    aria-label={
                        showPassword
                            ? t("auth.hidePassword")
                            : t("auth.showPassword")
                    }
                    size="icon-xs"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={props.isPending}
                >
                    {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
            </InputGroupAddon>
        </InputGroup>
    );
}
