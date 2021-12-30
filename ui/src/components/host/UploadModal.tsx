import { LoadingButton } from "@mui/lab"
import { Box, Input, Modal, Stack, Typography } from "@mui/material"
import { useRef, useState } from "react"


interface IUploadModalProps {
    open: boolean,
    onUpload: (file: File) => Promise<void>,
    // Show an error on the dialog. This will only arise if validation of the previously
    // uploaded file failed.
    uploadErrMsg?: string,
}

function UploadModal(props: IUploadModalProps): JSX.Element {

    const fileInput = useRef<HTMLInputElement>(null)
    const [fileSelected, setFileSelected] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUploading(true)
        if (fileInput.current != null) {
            const files = fileInput.current.files!
            await props.onUpload(files[0])
            setFileSelected(false)
            if (fileInput.current) {
                // clear the form element. This is needed in case of errors uploading which gets displayed
                // via the uploadErrMsg prop
                fileInput.current.value = ""
            }
        }
        setIsUploading(false)
    }

    const handleFileSelected = () => {
        setFileSelected(true)
    }

    const uploadErrMsgComponent = !fileSelected && props.uploadErrMsg
        ? <Typography color="red" variant="caption">{props.uploadErrMsg}</Typography>
        : undefined

    return (
        <Modal
            open={props.open}
        >
            <Box
                sx={{
                    // Position in the centre of the window
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: 'translate(-50%, -50%)',
                    width: "500px",
                    backgroundColor: "whitesmoke",
                    border: "1px solid black",
                    borderRadius: "12px",
                    padding: "24px"
                }}
            >
                <Typography
                    variant="h4"
                    textAlign="center"
                    marginBottom="24px"
                >Upload Quiz</Typography>
                <form onSubmit={handleSubmit}>
                    <Stack
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Input
                            required
                            disableUnderline
                            type="file"
                            inputRef={fileInput}
                            margin="none"
                            onInput={handleFileSelected}
                        />
                        {uploadErrMsgComponent}
                        <LoadingButton
                            type="submit"
                            disabled={!fileSelected}
                            loading={isUploading}
                        >Upload</LoadingButton>
                    </Stack>
                </form>
            </Box>
        </Modal>
    )
}

export default UploadModal