import { NicknameSchema } from "@week14/protocol";
import { Button } from "@week14/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@week14/ui/components/card";
import { Input } from "@week14/ui/components/input";
import { Label } from "@week14/ui/components/label";
import { useState, type FormEvent } from "react";

type NicknameFormProps = {
  connecting: boolean;
  serverError: string | null;
  onSubmit: (nickname: string) => void;
};

export function NicknameForm({ connecting, serverError, onSubmit }: NicknameFormProps) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // El mismo esquema que usa el servidor: el error aparece sin ir a la red.
    // (El servidor valida otra vez: el cliente se puede saltar.)
    const result = NicknameSchema.safeParse(nickname);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Apodo inválido");
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  const message = error ?? serverError;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Chat en tiempo real</CardTitle>
          <CardDescription>Elija un apodo para entrar. No hay contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Label htmlFor="nickname">Apodo</Label>
            <Input
              id="nickname"
              autoFocus
              autoComplete="off"
              placeholder="por ejemplo: ana_gt"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              aria-invalid={message ? true : undefined}
            />
            {message && <p className="text-destructive text-sm">{message}</p>}
            <Button type="submit">{connecting ? "Conectando..." : "Entrar"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
