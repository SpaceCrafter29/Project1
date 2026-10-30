# Demo video script (about 3 minutes)

Record with the real Meta API if possible; demo mode (`MODEL_PROVIDER=mock`) follows exactly the same flow and is a safe fallback. Use the sample images in `public/samples/` or your own photos.

## 0:00 – The problem (20 s)
"Olympiad training apps either give you the solution or nothing. Olympiad Coach guides you to *your own* proof – and it never claims you are wrong without proof."

Show the home page and click **New problem**.

## 0:20 – Upload and confirm (20 s)
Paste a screenshot of IMO 1964 Problem 1. The coach transcribes it and asks: *Did I read this correctly?* Point out that nothing is judged until you confirm.

## 0:40 – Understand, stage by stage (35 s)
Reveal **In simple words** and **Given / wanted**. Then reveal **Small cases**: "This table is computed by code in the browser, not invented by the model." Type the conjecture "7 divides 2^n − 1 exactly when n is a multiple of 3" and show the feedback, which code has tested for 5000 cases. Briefly show that the method hint and the proof skeleton stay locked until you ask for them.

## 1:15 – Handwritten solution (15 s)
Photograph the handwritten solution. Show the recognized steps next to the photo and fix a reading error, if there is one.

## 1:30 – Verified feedback (40 s)
- Step 2 is a **gap**: the pattern is true (the code check confirms it), but the reason is missing.
- Step 5 is an **error**: the code found a counterexample. Say: "7 is odd and divisible by 7 – checked, not guessed."
- Step 3 is **unclear**: the first reviewer criticized it, but an independent second check could not confirm the critique, so the app does not call it wrong.
- Click **I think my step is right** on step 3 and explain. The coach answers: "You are right, I overlooked …". The score rises from 3–4 to 4.

## 2:10 – Pen and repair (25 s)
Circle step 2 on the photo, then tap **Explain this**. On **Fix your approach**, show the card for part (b): it breaks at step 5, with the repair hints revealed in two levels.

## 2:35 – Learn other approaches (25 s)
Open **Other approaches** and walk through the three ideas:
- **Reducing exponents:** a full solution with a justification for every step. Click **That's not right?** on a step to show the re-check.
- **Induction:** marked "only logically checked".
- **Factorization:** the code caught a wrong result, so no solution is shown. Say: "verification is the default, not a feature badge."

## 3:00 – Close (10 s)
"Paper and pen for thinking, AI for coaching, code for checking. Olympiad Coach."
