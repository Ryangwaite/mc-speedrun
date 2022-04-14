import { useMediaQuery } from "@mui/material";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./store";
import theme from "./themes/theme";
import { PageVariant } from "./types";

// These are used throughout the App instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const usePageVariant = () => {
    
    const isLargeAndUp = useMediaQuery(theme.breakpoints.up("lg"))
    const isSmallAndUp = useMediaQuery(theme.breakpoints.up("sm"))

    let variant: PageVariant
    if (isLargeAndUp) {
        variant = PageVariant.LARGE
    } else if (isSmallAndUp) {
        variant = PageVariant.MEDIUM
    } else {
        variant = PageVariant.SMALL
    }

    return variant
}