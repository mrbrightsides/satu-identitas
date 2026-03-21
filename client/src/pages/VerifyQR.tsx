text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <KeyboardIcon className="w-4 h-4" />
                  Paste Token
                </button>
                <button
                  onClick={() => handleModeChange('camera')}
                  data-testid="tab-scan-camera"
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    mode === 'camera'
                      ? 'bg-background shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Scan QR
                </button>
              </div>

              {/* Paste Mode */}
              {mode === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ScanLine className="w-4 h-4" />
                    Paste JWT token from QR code
                  </div>
                  <Textarea
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="font-mono text-xs min-h-[120px] resize-none"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    data-testid="input-jwt-token"
                  />
                  <Button
                    onClick={() => verify()}
                    disabled={loading || !token.trim()}
                    className="w-full"
                    data-testid="button-verify-jwt"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                      : <><ShieldCheck className="w-4 h-4 mr-2" /> Verify Credential</>
                    }
                  </Button>
                </div>
              )}

              {/* Camera Mode */}
              {mode === 'camera' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Camera className="w-4 h-4" />
                    Point camera at the QR code
                  </div>
                  <QRCameraScanner onScan={handleScan} />
                  {scanned && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      QR scanned successfully — verifying...
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Verification uses HMAC-SHA256 signature check — no internet or blockchain required
              </p>
            </CardContent>
          </Card>

          {/* Loading state */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 py-8"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking signature...</p>
            </motion.div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                {result.valid && result.payload ? (
                  <Card className="border-green-200 shadow-lg overflow-hidden">
                    <div className="h-1.5 w-full bg-green-500" />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-full">
                          <ShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-green-700 text-lg">Credential Valid</p>
                          <p className="text-sm text-green-600">Signature verified · No blockchain needed</p>
                        </div>
                        <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                          {result.payload.identityType === 'citizen' ? '🇮🇩 WNI' : '🌏 Visitor'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoRow icon={<BadgeCheck className="w-4 h-4" />} label="Full Name" value={result.payload.fullName} />
                        <InfoRow icon={<Fingerprint className="w-4 h-4" />} label="Identity Type" value={result.payload.identityType === 'citizen' ? `WNI — ${result.payload.idType}` : `Visitor — ${result.payload.visaType}`} />

                        {result.payload.idHash && (
                          <InfoRow icon={<FileKey2 className="w-4 h-4" />} label="ID Hash (SHA-256)" value={`${result.payload.idHash.substring(0, 16)}...`} mono />
                        )}
                        {result.payload.passportHash && (
                          <InfoRow icon={<FileKey2 className="w-4 h-4" />} label="Passport Hash" value={`${result.payload.passportHash.substring(0, 16)}...`} mono />
                        )}
                        {result.payload.nationality && (
                          <InfoRow icon={<Globe className="w-4 h-4" />} label="Nationality" value={result.payload.nationality} />
                        )}
                        {result.payload.visaExpiry && (
                          <InfoRow icon={<Clock className="w-4 h-4" />} label="Visa Expiry" value={new Date(result.payload.visaExpiry).toLocaleDateString('id-ID', { dateStyle: 'long' })} />
                        )}

                        <InfoRow
                          icon={<Clock className="w-4 h-4" />}
                          label="Issued At"
                          value={formatDate(result.payload.iat)}
                        />
                        <InfoRow
                          icon={<Clock className="w-4 h-4" />}
                          label={isExpired ? "Expired At" : "Valid Until"}
                          value={formatDate(result.payload.exp)}
                          highlight={isExpired ? 'red' : 'green'}
                        />

                        <div className="sm:col-span-2">
                          <InfoRow
                            icon={<Fingerprint className="w-4 h-4" />}
                            label="DID"
                            value={result.payload.did}
                            mono
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <InfoRow
                            icon={<ShieldCheck className="w-4 h-4" />}
                            label="Issuer"
                            value={result.payload.iss}
                            mono
                          />
                        </div>

                        {result.payload.txHash && (
                          <div className="sm:col-span-2">
                            <InfoRow
                              icon={<BadgeCheck className="w-4 h-4" />}
                              label="Blockchain Tx"
                              value={`${result.payload.txHash.substring(0, 20)}...`}
                              mono
                              highlight="green"
                            />
                          </div>
                        )}
                      </div>

                      {isExpired && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          This credential has expired. Please ask the holder to generate a new one.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-red-200 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-red-500" />
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="p-2 bg-red-100 rounded-full shrink-0">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-red-700 text-lg">Credential Invalid</p>
                        <p className="text-sm text-red-600 mt-1">{result.message || 'The token could not be verified.'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function InfoRow({
  icon, label, value, mono = false, highlight
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: 'green' | 'red';
}) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-medium break-all ${mono ? 'font-mono' : ''} ${
        highlight === 'green' ? 'text-green-700' : highlight === 'red' ? 'text-red-600' : 'text-foreground'
      }`}>
        {value}
      </p>
    </div>
  );
}
