import { WebsocketConnectionStateType } from '../../api/websocket';
import CircleIcon from '@mui/icons-material/Circle';
import { Fade, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import theme from '../../themes/theme';
import { orange } from '@mui/material/colors';

interface IConnectionIndicatorProps {
    connectionState: WebsocketConnectionStateType,
}

export function ConnectionIndicator({connectionState}: IConnectionIndicatorProps) {

    let isSmallAndUp = useMediaQuery(theme.breakpoints.up("sm"));
    
    let text
    let color
    switch (connectionState) {
        case WebsocketConnectionStateType.UNINITIALIZED:
            return null
        case WebsocketConnectionStateType.CONNECTING:
            text = "Connecting..."    
            color = orange[400]
            break
        case WebsocketConnectionStateType.CONNECTED:
            text = "Connected"
            color = theme.palette.success[400]
            break
        case WebsocketConnectionStateType.DISCONNECTED:
            text = "Disconnected"
            color = theme.palette.error[400]
            break
        case WebsocketConnectionStateType.RECONNECTING:
            text = "Reconnecting..."
            color = orange[400]
            break
        default:
            throw new Error(`Unexpected websocket connection state: '${connectionState}'`)
    }

    let content
    if (isSmallAndUp) {
        content = (
            <>
                <CircleIcon
                    htmlColor={color}
                    sx={{
                        marginRight: 1,
                        marginLeft: 1,
                    }}
                />
                <Typography
                    variant="body2"
                    color={theme.palette.getContrastText(theme.palette.grey[100])}
                    marginRight={1}
                >{text}</Typography>
            </>
        )
    } else {
        // small devices
        content = (
            <Tooltip title={text} placement='bottom-end'>
                <CircleIcon
                    titleAccess='status indicator'
                    htmlColor={color}
                    sx={{
                        marginRight: 1,
                        marginLeft: 1,
                    }}
                />
            </Tooltip>
        )
    }

    return (
        <Fade in={true}>
            <Stack
                role={"status"}
                direction="row"
                alignItems={"center"}
                borderRadius={4}
                padding={0.5}
                marginRight={3}
                sx={{
                    backgroundColor: "transparent",
                }}
            >
                {content}
            </Stack>
        </Fade>
    )
}