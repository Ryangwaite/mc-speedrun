import {AppBar, Box, SxProps, Toolbar, Typography} from '@mui/material';
import { Theme } from '@mui/system';
import { WebsocketConnectionStateType } from '../../api/websocket';
import { APP_NAME } from '../../const';
import theme from '../../themes/theme';
import { ConnectionIndicator } from './ConnectionIndicator';
import { ReactComponent as Logo } from '../../logo.drawio.svg';

export const APP_BAR_HEIGHT = "50px"

const appbarStyles: SxProps<Theme> = {
    boxShadow: 0, // no drop shadow
    backgroundColor: "transparent",
}

interface ITopBarProps {
    connectionState: WebsocketConnectionStateType,
}

export function TopBar({connectionState}: ITopBarProps) {
    return (
        <AppBar
            sx={{
                ...appbarStyles,
                // Force the appbar to be positioned in the document flow
                position: "static",
            }}
        >
            <Toolbar
                disableGutters={true}
                sx={{
                    ...appbarStyles,
                }}
            >
                <Logo
                    height={24}
                    width={24}
                    style={{
                        marginLeft: theme.spacing(3),
                        padding: 0,
                        height: "100%",
                    }}
                />
                <Typography
                    variant="h5"
                    marginLeft={1.5}
                    color={theme.palette.getContrastText(theme.palette.grey[100])}
                    sx={{
                        flexGrow: 1, // push the connection state to the right
                    }}
                >{APP_NAME}</Typography>
                <ConnectionIndicator connectionState={connectionState} />
            </Toolbar>
        </AppBar>
    )
}