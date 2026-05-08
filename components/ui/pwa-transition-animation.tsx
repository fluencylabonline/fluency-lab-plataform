export function PWATransitionAnimation() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-background z-100 animate-in fade-in duration-500 flex flex-col items-center justify-center">
      <video
        className="lg:w-[20%] md:w-[35%] w-[60%] max-h-[50vh] pointer-events-none"
        controls={false}
        loop
        autoPlay
        muted
        playsInline
      >
        <source
          src="https://firebasestorage.googleapis.com/v0/b/fluencylab-webapp.appspot.com/o/Animations%2FFluencyLab_Final.webm?alt=media&token=870b22b3-0a99-4301-b736-f1c6ad30bab5"
          type="video/webm"
        />
      </video>
    </div>
  );
}
