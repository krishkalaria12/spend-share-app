import mongoose from "mongoose";
import { envKeys } from "./env";

type ConnectionObject = {
    isConnected? : number;
}

const connection: ConnectionObject = {}

export async function connect(): Promise<void> {
    if (connection.isConnected) {
        console.log("Already connnected to DB");
        return
    }

    try {
        const db = await mongoose.connect(envKeys.databaseURL || "")
        
        connection.isConnected = db.connections[0].readyState

        console.log("DB Connected Successfully");
        
    } catch (error) {
        console.log("DB Connection Failed" , error);
        
        process.exit(1)
    }
}