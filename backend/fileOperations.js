import fs from "fs"

const fileName = "booking.txt"
const renamedFile = "booking_updated.txt"

try {

  fs.writeFileSync(fileName, "Electrician booked for wiring service\n")
  console.log("File created and booking data written successfully")

  let data = fs.readFileSync(fileName, "utf8")
  console.log("Reading booking details:")
  console.log(data)

  fs.appendFileSync(fileName, "Service completed successfully\n")
  console.log("Service status appended successfully")

  data = fs.readFileSync(fileName, "utf8")
  console.log("Updated booking details:")
  console.log(data)

  fs.renameSync(fileName, renamedFile)
  console.log("Booking file renamed successfully")

  fs.unlinkSync(renamedFile)
  console.log("Booking file deleted successfully")

} catch (error) {
  console.error("File operation error:", error.message)
}