"use client";

import { PropsWithChildren } from "react";

interface Props {
    onClick: () => void;
}

export default function CustomButton(props: PropsWithChildren<Props>) {
    const { children, onClick } = props;
    function handleClick() {
        const result = confirm("Are you sure?");
        if (result) {
            onClick?.();
        } else {
            console.log("canceled");
        }
    }
    return (
        <button
            className="rounded-md border p-2 hover:bg-gray-100"
            onClick={handleClick}
        >
            {children}
        </button>
    );
}
