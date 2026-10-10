import { TextSchema } from "@week14/protocol";
import { Button } from "@week14/ui/components/button";
import { Textarea } from "@week14/ui/components/textarea";
import { SendHorizontal } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

type ComposerProps = {
  placeholder: string;
  disabled: boolean;
  onSend: (text: string) => void;
};

export function Composer({ placeholder, disabled, onSend }: ComposerProps) {
  const [text, setText] = useState("");

  function submit() {
    const result = TextSchema.safeParse(text);
    if (!result.success || disabled) return;
    onSend(result.data);
    setText("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  // Enter envía; Shift + Enter hace un salto de línea.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t p-3">
      <Textarea
        rows={1}
        maxLength={500}
        className="max-h-40 min-h-10 resize-none"
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button type="submit" size="icon" disabled={disabled || text.trim() === ""} aria-label="Enviar">
        <SendHorizontal />
      </Button>
    </form>
  );
}
