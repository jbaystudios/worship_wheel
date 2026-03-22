const icons: Record<string, React.ReactNode> = {
  // Fretboard — grid icon
  FB: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44.3333 7H11.6667C9.08934 7 7 9.08934 7 11.6667V44.3333C7 46.9107 9.08934 49 11.6667 49H44.3333C46.9107 49 49 46.9107 49 44.3333V11.6667C49 9.08934 46.9107 7 44.3333 7Z" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 21H49" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 35H49" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 7V49" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 7V49" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Harmony — music notes
  HM: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 42V11.6667L49 7V37.3333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 49C17.866 49 21 45.866 21 42C21 38.134 17.866 35 14 35C10.134 35 7 38.134 7 42C7 45.866 10.134 49 14 49Z" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M42 44.3333C45.866 44.3333 49 41.1992 49 37.3333C49 33.4673 45.866 30.3333 42 30.3333C38.134 30.3333 35 33.4673 35 37.3333C35 41.1992 38.134 44.3333 42 44.3333Z" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Melody — audio waveform bars
  ML: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.66699 23.3333V30.3333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 14V39.6667" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.333 7V49" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32.667 18.6667V35.0001" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M42 11.6667V42.0001" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M51.333 23.3333V30.3333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Rhythm — flag/paragraph symbol
  RH: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.333 4.66675V51.3334" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.3333 14H11.6667C10.429 14 9.242 14.4917 8.36683 15.3668C7.49167 16.242 7 17.429 7 18.6667V21C7 22.2377 7.49167 23.4247 8.36683 24.2998C9.242 25.175 10.429 25.6667 11.6667 25.6667H23.3333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.333 32.6667H37.333C38.5707 32.6667 39.7577 33.1584 40.6328 34.0336C41.508 34.9088 41.9997 36.0957 41.9997 37.3334V39.6667C41.9997 40.9044 41.508 42.0914 40.6328 42.9666C39.7577 43.8417 38.5707 44.3334 37.333 44.3334H23.333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Tone — sliders
  TO: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M49.0003 9.33325H32.667" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.3333 9.33325H7" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M49 28H28" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.6667 28H7" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M48.9997 46.6667H37.333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 46.6667H7" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32.667 4.66675V14.0001" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.667 23.3333V32.6666" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M37.333 42V51.3333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Theory — brain/leaf symmetry
  TH: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28.0003 11.6666C28.003 10.7334 27.8191 9.80897 27.4594 8.94782C27.0996 8.08667 26.5713 7.30615 25.9055 6.65216C25.2398 5.99817 24.4499 5.48392 23.5825 5.13966C22.715 4.7954 21.7875 4.62807 20.8544 4.64752C19.9213 4.66696 19.0016 4.8728 18.1492 5.25291C17.2969 5.63302 16.5292 6.17974 15.8912 6.8609C15.2532 7.54206 14.7579 8.34392 14.4344 9.21931C14.1108 10.0947 13.9656 11.026 14.0073 11.9583C12.6357 12.3109 11.3624 12.9711 10.2838 13.8887C9.20516 14.8063 8.34948 15.9573 7.78156 17.2546C7.21363 18.5519 6.94836 19.9614 7.00583 21.3764C7.0633 22.7913 7.442 24.1747 8.11325 25.4216C6.93301 26.3805 6.00492 27.6132 5.40971 29.0125C4.81451 30.4118 4.57022 31.9353 4.6981 33.4506C4.82599 34.9658 5.32216 36.4269 6.14347 37.7067C6.96478 38.9864 8.08634 40.0462 9.41059 40.7936C9.24706 42.0588 9.34465 43.3441 9.69732 44.5702C10.05 45.7962 10.6503 46.9369 11.4611 47.9218C12.2719 48.9068 13.276 49.7151 14.4114 50.2967C15.5469 50.8784 16.7895 51.2211 18.0625 51.3037C19.3356 51.3863 20.6121 51.2071 21.8132 50.777C23.0142 50.347 24.1144 49.6753 25.0457 48.8034C25.977 47.9315 26.7197 46.8779 27.2278 45.7078C27.736 44.5376 27.9989 43.2757 28.0003 42V11.6666Z" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 11.6666C27.9973 10.7334 28.1812 9.80897 28.5409 8.94782C28.9006 8.08667 29.4289 7.30615 30.0947 6.65216C30.7605 5.99817 31.5504 5.48392 32.4178 5.13966C33.2853 4.7954 34.2128 4.62807 35.1459 4.64752C36.0789 4.66696 36.9987 4.8728 37.851 5.25291C38.7034 5.63302 39.4711 6.17974 40.1091 6.8609C40.7471 7.54206 41.2424 8.34392 41.5659 9.21931C41.8894 10.0947 42.0347 11.026 41.993 11.9583C43.3646 12.3109 44.6379 12.9711 45.7165 13.8887C46.7951 14.8063 47.6508 15.9573 48.2187 17.2546C48.7867 18.5519 49.0519 19.9614 48.9945 21.3764C48.937 22.7913 48.5583 24.1747 47.887 25.4216C49.0673 26.3805 49.9954 27.6132 50.5906 29.0125C51.1858 30.4118 51.4301 31.9353 51.3022 33.4506C51.1743 34.9658 50.6781 36.4269 49.8568 37.7067C49.0355 38.9864 47.9139 40.0462 46.5897 40.7936C46.7532 42.0588 46.6556 43.3441 46.303 44.5702C45.9503 45.7962 45.35 46.9369 44.5392 47.9218C43.7284 48.9068 42.7243 49.7151 41.5888 50.2967C40.4534 50.8784 39.2108 51.2211 37.9378 51.3037C36.6647 51.3863 35.3882 51.2071 34.1871 50.777C32.9861 50.347 31.8859 49.6753 30.9546 48.8034C30.0233 47.9315 29.2806 46.8779 28.7724 45.7078C28.2643 44.5376 28.0014 43.2757 28 42V11.6666Z" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 30.3333C33.041 29.6442 31.3304 28.3897 30.0844 26.7283C28.8384 25.067 28.1131 23.0736 28 21C27.8869 23.0736 27.1616 25.067 25.9156 26.7283C24.6696 28.3897 22.959 29.6442 21 30.3333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 42C29.8565 42 31.637 41.2625 32.9497 39.9497C34.2625 38.637 35 36.8565 35 35C35 33.1435 34.2625 31.363 32.9497 30.0503C31.637 28.7375 29.8565 28 28 28C26.1435 28 24.363 28.7375 23.0503 30.0503C21.7375 31.363 21 33.1435 21 35C21 36.8565 21.7375 38.637 23.0503 39.9497C24.363 41.2625 26.1435 42 28 42Z" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Technique — hand
  TE: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M42.0003 25.6666V13.9999C42.0003 12.7622 41.5087 11.5753 40.6335 10.7001C39.7583 9.82492 38.5713 9.33325 37.3337 9.33325C36.096 9.33325 34.909 9.82492 34.0338 10.7001C33.1587 11.5753 32.667 12.7622 32.667 13.9999" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32.6663 23.3334V9.33341C32.6663 8.09574 32.1747 6.90875 31.2995 6.03358C30.4243 5.15841 29.2374 4.66675 27.9997 4.66675C26.762 4.66675 25.575 5.15841 24.6998 6.03358C23.8247 6.90875 23.333 8.09574 23.333 9.33341V14.0001" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.3333 24.4999V13.9999C23.3333 12.7622 22.8417 11.5753 21.9665 10.7001C21.0913 9.82492 19.9043 9.33325 18.6667 9.33325C17.429 9.33325 16.242 9.82492 15.3668 10.7001C14.4917 11.5753 14 12.7622 14 13.9999V32.6666" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M41.9996 18.6667C41.9996 17.429 42.4913 16.242 43.3664 15.3668C44.2416 14.4917 45.4286 14 46.6663 14C47.9039 14 49.0909 14.4917 49.9661 15.3668C50.8413 16.242 51.3329 17.429 51.3329 18.6667V32.6667C51.3329 37.6174 49.3663 42.3653 45.8656 45.866C42.3649 49.3667 37.617 51.3333 32.6663 51.3333H27.9996C21.4663 51.3333 17.4996 49.3267 14.0229 45.8733L5.62292 37.4733C4.82011 36.5842 4.38996 35.4204 4.42155 34.2229C4.45313 33.0253 4.94403 31.8858 5.7926 31.0402C6.64118 30.1947 7.78243 29.7078 8.98006 29.6805C10.1777 29.6531 11.34 30.0874 12.2263 30.8933L16.3329 30.3333" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Aural — ear/lightbulb
  AU: (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 19.8334C14 15.811 15.5979 11.9533 18.4422 9.10896C21.2865 6.26466 25.1442 4.66675 29.1667 4.66675C33.1891 4.66675 37.0468 6.26466 39.8911 9.10896C42.7354 11.9533 44.3333 15.811 44.3333 19.8334C44.3333 33.8334 30.3333 35.0001 30.3333 44.3334" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M34.9997 19.8333C34.9997 18.2862 34.3851 16.8025 33.2911 15.7085C32.1972 14.6146 30.7134 14 29.1663 14C27.6192 14 26.1355 14.6146 25.0416 15.7085C23.9476 16.8025 23.333 18.2862 23.333 19.8333V22.1667C24.5707 22.1667 25.7577 22.6583 26.6328 23.5335C27.508 24.4087 27.9997 25.5957 27.9997 26.8333C27.9997 28.071 27.508 29.258 26.6328 30.1332C25.7577 31.0083 24.5707 31.5 23.333 31.5" stroke="currentColor" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="30.3333" cy="51.3333" r="2.33333" fill="currentColor"/>
    </svg>
  ),
};

export function ElementIcon({ code }: { code: string }) {
  return (
    <div className="text-accent-500">
      {icons[code] ?? null}
    </div>
  );
}
