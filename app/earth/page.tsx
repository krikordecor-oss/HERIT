export default function Earth() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "#050816",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial"
      }}
    >
      <h1
        style={{
          fontSize: "4rem",
          marginBottom: "20px"
        }}
      >
        🌍 HERIT EARTH
      </h1>

      <p
        style={{
          fontSize: "1.5rem",
          opacity: 0.8
        }}
      >
        Understanding the Physical World
      </p>

      <div
        style={{
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 30%, #4FC3F7, #0D47A1, #001220)",
          marginTop: 50,
          boxShadow: "0 0 80px #2196f3"
        }}
      />
    </main>
  );
}