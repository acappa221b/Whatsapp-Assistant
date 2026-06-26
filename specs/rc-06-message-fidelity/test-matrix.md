# RC-06 Message Fidelity — Test Matrix

| ID | Case |
|----|------|
| T-01 | DM incoming → chatName = sender pushName |
| T-02 | DM outgoing fromMe → chatName ≠ own pushName |
| T-03 | Group → chatName = group subject |
| T-04 | extendedTextMessage.text preserved |
| T-05 | documentWithCaptionMessage caption preserved |
| T-06 | templateButtonReplyMessage text preserved |
| T-07 | editedMessage unwrap preserves text |
| T-08 | resolveMessagePreview keeps real TEXT |
| T-09 | fidelity metrics endpoint shape |
| T-10 | harness spec + contact resolver |
