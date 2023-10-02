import React from "react"

type TModalState = "open" | "closed"

const useModalState = () => {
	const [state, setState] = React.useState<TModalState>("closed");
	return { state, setState } as const;
}

export type ModalState = ReturnType<typeof useModalState>

export { useModalState }
