import Image from 'next/image';

const MinionsGif = () => (
    <div>
      <Image
        src="/assets/images/emptyspace.gif" // Path to your GIF in the public folder
        alt="Minions GIF"
        width={500} // Set your desired width
        height={250} // Set your desired height
      />
    </div>
  );

export default MinionsGif;
