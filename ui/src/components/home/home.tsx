import { Box, Divider, Stack } from "@mui/material";
import { Theme, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from "react-router-dom";
import { getJwtTokenClaims, getParticipantJwtTokenClaims, postHostQuiz, postJoinQuiz } from "../../api/auth";
import { websocketConnect } from "../../middleware/websocket";
import { useAppDispatch } from "../../hooks";
import { setUserId } from "../../slices/participant";
import { setClientType, setQuizId } from "../../slices/common";
import { ClientType } from "../../types";
import TextButtonCard from "./TextButtonCard";
import ButtonCard from "./ButtonCard";
import ResponsiveDivider from "./ResponsiveDivider";

interface IHomeProps {
    // TODO
}

function Home(props: IHomeProps) {
    const theme: Theme = useTheme();
    const isSmallAndUp = useMediaQuery(theme.breakpoints.up("sm"));

    const dispatch = useAppDispatch()
    let navigate = useNavigate();

    const onParticipantJoin = async (code: string) => {
        console.debug(`Joining lobby with code '${code}'`)
        try {
            const authorizationResponse = await postJoinQuiz(code)
            const token = authorizationResponse.access_token
            const { userId, quizId } = getParticipantJwtTokenClaims(token)

            dispatch(setClientType(ClientType.PARTICIPANT))
            dispatch(setUserId(userId))
            dispatch(setQuizId(quizId))
            dispatch(websocketConnect(token))

            navigate(`/lobby`)
        } catch (e) {
            alert("Failed to join session:" + e)
        }
    }

    const onHostBegin = async () => {
        console.debug('Hosting lobby')
        try {
            const authorizationResponse = await postHostQuiz()
            const token = authorizationResponse.access_token
            const { quizId } = getJwtTokenClaims(token)

            dispatch(setClientType(ClientType.HOST))
            dispatch(setQuizId(quizId))
            dispatch(websocketConnect(token))

            navigate(`/config`)
        } catch (e) {
            alert("Failed to host session:" + e)
        }
    }

    // NOTE: Need to wrap in a <Box /> so that the "OR" text remains in the center of the
    //       dividing line when displayed in a column
    const divider = (
        <Box
            marginLeft="10%"
            marginRight="10%"
            marginTop="10%"
            marginBottom="10%"
            width={isSmallAndUp ? undefined : "80%"}
        >
            <ResponsiveDivider orientation={isSmallAndUp ? "vertical" : "horizontal"} />
        </Box>
    )

    return (
        <Stack
            direction={isSmallAndUp ? "row" : "column"}
            divider={divider}
            alignItems="center"
            justifyContent="center"
            height="100vh"
        >
            <TextButtonCard
                title={"Join"}
                label={"Access Code"}
                buttonLabel={"Enter"}
                onSubmit={onParticipantJoin}
            />
            <ButtonCard
                title={"Host"}
                buttonLabel={"Begin"}
                onSubmit={onHostBegin}
            />
        </Stack>
    )
}

export default Home;