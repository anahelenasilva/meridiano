import { configDotenv } from "dotenv"
import express, { Application } from "express"
import { router } from "./routes"

configDotenv()

const app: Application = express()
const port = process.env.PORT ?? 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(router)

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`)
})
