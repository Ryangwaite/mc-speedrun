import {AppBar, SxProps, Toolbar, Typography} from '@mui/material';
import { Theme } from '@mui/system';
import { WebsocketConnectionStateType } from '../../api/websocket';
import { APP_NAME } from '../../const';
import { ConnectionIndicator } from './ConnectionIndicator';

export const APP_BAR_HEIGHT = "48px"//"64px"

const appbarStyles: SxProps<Theme> = {
    boxShadow: 0, // no drop shadow
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
                <Typography
                    variant="h1"
                    marginLeft={4}
                    sx={{
                        fontSize: {
                            xs: "1.5rem",
                            sm: "2.0rem"
                        },
                        flexGrow: 1, // push the connection state to the right
                    }}
                >{APP_NAME}</Typography>
                <ConnectionIndicator connectionState={connectionState} />
            </Toolbar>
        </AppBar>
    )
}