import React, { useEffect, useState } from "react";

export function Firework() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FF00FF",
      "#00FFFF",
    ];
    const particleCount = 50;
    const initialParticles = [];

    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: (Math.PI * 2 * i) / particleCount,
        speed: 2 + Math.random() * 4,
        size: 2 + Math.random() * 4,
      });
    }

    setParticles(initialParticles);

    let animationFrame;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed < 2000) {
        // Animation duration: 2 seconds
        setParticles((prevParticles) =>
          prevParticles.map((particle) => ({
            ...particle,
            x: particle.x + Math.cos(particle.angle) * particle.speed,
            y:
              particle.y +
              Math.sin(particle.angle) * particle.speed +
              (0.1 * elapsed) / 50,
            speed: particle.speed * 0.99,
          }))
        );

        animationFrame = requestAnimationFrame(animate);
      } else {
        setParticles([]);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
