import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export const ServerError = () => {
  return (
    <View style={styles.container}>
      {/* Displaying PNG image */}
      <Image 
        source={require('@/assets/images/server-error.png')}
        style={styles.errorImage} 
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.errorCode}>500</Text>
        <Text style={styles.errorMessage}>Server Error</Text>
        <Text style={styles.errorDescription}>
          Whoops, something went wrong on our servers.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorImage: {
    width: "80%",
    height: 300,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: "center",
  },
  errorCode: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#6c757d",
  },
  errorMessage: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#6c757d",
  },
  errorDescription: {
    fontSize: 18,
    color: "#868e96",
    textAlign: "center",
    marginTop: 10,
  },
});

export default ServerError;