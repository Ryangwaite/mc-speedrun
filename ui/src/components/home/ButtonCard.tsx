import { Button, Card, CardActions, CardHeader } from "@mui/material"

interface IButtonCardProps {
    title: string,
    buttonLabel: string,
    onSubmit: () => void
}

function ButtonCard(props: IButtonCardProps) {
    
    const { title, buttonLabel, onSubmit} = props
    return (
        <Card sx={{
            width: 320,
        }}>
            <CardHeader title={title} sx={{ textAlign: "center" }} />
            <CardActions
                sx={{
                    height: 80
                }}
            >
                <Button
                    onClick={onSubmit}
                    variant="contained" 
                    fullWidth
                >{buttonLabel}</Button>
            </CardActions>
        </Card>
    )
}

export default ButtonCard