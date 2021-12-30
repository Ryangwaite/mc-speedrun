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
            <CardHeader
                title={title}
                sx={{
                    textAlign: "center",
                    padding: 0,
                    marginTop: 3,
                }}
            />
            <CardActions>
                <Button
                    onClick={onSubmit}
                    variant="contained" 
                    fullWidth
                    sx={{
                        marginRight: 3,
                        marginLeft: 3,
                        marginTop: 4,
                        marginBottom: 4,
                    }}
                >{buttonLabel}</Button>
            </CardActions>
        </Card>
    )
}

export default ButtonCard