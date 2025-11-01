exports.handler = async (event) => {
    console.log("Lambda created with success!");

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello from Lambda!" })
    }
}