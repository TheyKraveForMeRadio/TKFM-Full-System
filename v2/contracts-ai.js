// AI CONTRACT ENGINE — TKFM v2

function generateContract() {
  const type = document.getElementById("type").value;
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const offer = document.getElementById("offer").value;
  const today = new Date().toLocaleDateString();

  if (!name || !email || !offer) {
    alert("Enter all fields first.");
    return;
  }

  const templates = {
    artist: `
      THEY KRAVE FOR ME RADIO — ARTIST SERVICE AGREEMENT
      Date: ${today}
      Artist Name: ${name}
      Email: ${email}
      Service Package: ${offer}

      This Agreement confirms that the Artist requests promotional, rotation,
      feature placement, and platform support through They Krave For Me Radio.

      Artist agrees that services are non-refundable once delivered,
      pricing may adjust without notice, and performance results are not guaranteed.

      TKFM reserves the right to refuse material if content violates
      broadcast rules or legal policies.

      Electronic signature by Artist below confirms consent:

      SIGNATURE: _________________________
      PRINT NAME: ${name}
    `,

    dj: `
      THEY KRAVE FOR ME RADIO — DJ RESIDENCY AGREEMENT
      Date: ${today}
      DJ / Stage Name: ${name}
      Email: ${email}
      Residency Level: ${offer}

      DJ agrees to deliver mixes for broadcast on schedule and maintain
      broadcast quality limits. TKFM provides platform exposure and lane access.
      AI DJ Engine remains Owner-Exclusive unless DJ subscription applies.

      SIGNATURE: _________________________
      PRINT NAME: ${name}
    `,

    label: `
      THEY KRAVE FOR ME RECORDS — LABEL SIGNING AGREEMENT
      Date: ${today}
      Signer: ${name}
      Email: ${email}
      Plan: ${offer}

      This agreement confirms that the Artist/Label is entering into a
      monthly business relationship for promotion, distribution, and
      strategic placement.

      All intellectual property remains owned by the Artist unless
      negotiated otherwise in writing.

      SIGNATURE: _________________________
      PRINT NAME: ${name}
    `,

    sponsor: `
      THEY KRAVE FOR ME RADIO — SPONSORSHIP AGREEMENT
      Date: ${today}
      Sponsor Name: ${name}
      Email: ${email}
      Package: ${offer}

      Sponsor agrees to compensation for promotional placement as outlined
      in current TKFM sponsorship structures. All terms renew monthly.

      SIGNATURE: _________________________
      PRINT NAME: ${name}
    `
  };

  document.getElementById("output").textContent = templates[type];

  // Save locally until Supabase hookup
  localStorage.setItem(`tkfm_contract_${email}`, templates[type]);
}

window.generateContract = generateContract;
