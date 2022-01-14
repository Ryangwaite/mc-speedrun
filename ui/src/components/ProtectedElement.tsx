import { ReactElement } from "react";
import { Navigate, } from "react-router-dom";
import { useAppSelector } from "../hooks";
import { selectClientType } from "../slices/common";
import { ClientType } from "../types";

function ProtectedElement({children}: {children: ReactElement}): ReactElement {

    const clientType = useAppSelector(state => selectClientType(state))

    if (clientType === ClientType.UNKNOWN) {
        // Client hasn't established a connection yet - navigate to the home page so they can do so
        return <Navigate to="/" />
    }

    return children
}

export default ProtectedElement