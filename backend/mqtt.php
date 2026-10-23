<?php

declare(strict_types=1);

final class MqttClient
{

    private $socket = null;

private int $keepAlive = 30;

public function connect(string $host, int $port, string $clientId, int $keepAlive = 30): void
    {

        $this->keepAlive = $keepAlive;

$errorNumber = 0;
        $errorMessage = '';

$socket = @stream_socket_client(
            sprintf('tcp://%s:%d', $host, $port),
            $errorNumber,
            $errorMessage,
            5
        );

if ($socket === false) {
            throw new RuntimeException(sprintf('MQTT connection failed: %s (%d)', $errorMessage, $errorNumber));
        }

$this->socket = $socket;

stream_set_timeout($this->socket, 1);

$payload = $this->encodeString('MQTT')
            . chr(4)
            . chr(0x02)
            . pack('n', $keepAlive)
            . $this->encodeString($clientId);

$this->writePacket(0x10, $payload);
        $packet = $this->readPacket();

if ($packet === null) {
            throw new RuntimeException('MQTT broker did not answer the CONNECT request.');
        }

if ($packet['type'] !== 2 || strlen($packet['body']) < 2 || $packet['body'][1] !== "\x00") {
            throw new RuntimeException('MQTT broker rejected the connection.');
        }
    }

public function subscribe(string $topic): void
    {

        $payload = pack('n', 1)
            . $this->encodeString($topic)
            . chr(0);

$this->writePacket(0x82, $payload);

$packet = $this->readPacket();

if ($packet === null) {
            throw new RuntimeException('MQTT broker did not answer the SUBSCRIBE request.');
        }

if ($packet['type'] !== 9 || (ord(substr($packet['body'], -1)) & 0x80) !== 0) {
            throw new RuntimeException('MQTT broker refused the subscription to ' . $topic);
        }
    }

public function readMessage(): ?string
    {

        $packet = $this->readPacket();

if ($packet === null) {
            return null;
        }

if ($packet['type'] !== 3) {
            return null;
        }

$topicLength = unpack('n', substr($packet['body'], 0, 2))[1];

$message = substr($packet['body'], 2 + $topicLength);

return $message;
    }

public function ping(): void
    {

        $this->writePacket(0xC0, '');
    }

public function disconnect(): void
    {

        if ($this->socket === null) {
            return;
        }

try {

            $this->writePacket(0xE0, '');
        } catch (Throwable $error) {

        }

@fclose($this->socket);

$this->socket = null;
    }

public function getKeepAlive(): int
    {

        return $this->keepAlive;
    }

private function encodeString(string $value): string
    {

        return pack('n', strlen($value)) . $value;
    }

private function writePacket(int $header, string $body): void
    {

        if ($this->socket === null) {
            throw new RuntimeException('MQTT client is not connected.');
        }

$packet = chr($header) . $this->encodeLength(strlen($body)) . $body;

$written = @fwrite($this->socket, $packet);

if ($written === false || $written < strlen($packet)) {
            throw new RuntimeException('Could not write to the MQTT socket.');
        }
    }

private function readPacket(): ?array
    {

        $firstByte = $this->readBytes(1);

if ($firstByte === null) {
            return null;
        }

$type = ord($firstByte) >> 4;

$remainingLength = 0;

$multiplier = 1;

$digit = 0;

do {

            $lengthByte = $this->readBytes(1);

if ($lengthByte === null) {
                throw new RuntimeException('MQTT connection timed out while reading a packet.');
            }

$digit = ord($lengthByte);

$remainingLength += ($digit & 127) * $multiplier;

$multiplier *= 128;
        } while (($digit & 128) !== 0);

$body = $remainingLength > 0 ? $this->readBytes($remainingLength) : '';

if ($body === null) {
            throw new RuntimeException('MQTT connection timed out while reading a packet body.');
        }

return ['type' => $type, 'body' => $body];
    }

private function readBytes(int $length): ?string
    {

        if ($this->socket === null) {
            throw new RuntimeException('MQTT client is not connected.');
        }

$data = '';

while (strlen($data) < $length) {

            $chunk = @fread($this->socket, $length - strlen($data));

if ($chunk === false || $chunk === '') {

                $meta = stream_get_meta_data($this->socket);

if ($meta['timed_out']) {
                    return null;
                }

throw new RuntimeException('MQTT connection was closed by the broker.');
            }

$data .= $chunk;
        }

return $data;
    }

private function encodeLength(int $length): string
    {

        $encoded = '';

do {

            $digit = $length % 128;

$length = intdiv($length, 128);

if ($length > 0) {
                $digit |= 128;
            }

$encoded .= chr($digit);
        } while ($length > 0);

return $encoded;
    }
}
