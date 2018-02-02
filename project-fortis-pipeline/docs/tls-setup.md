# TLS setup for Fortis

## Prerequisites

To enable TLS for your Fortis site, you'll need:

1. A domain where you have access to the DNS.
2. A TLS certificate and private key (optional).

## Deployment steps

During the Fortis deployment find the `Endpoint Protection` field in the Fortis
setup wizard. There are three options in the dropdown:

1. `none`: set up a non-secure Fortis site (no https, no login).

2. `tls_provide_certificate`: set up a secure Fortis site using your own TLS
  certificate.

3. `tls_lets_encrypt`: set up a secure Fortis site and have LetsEncrypt generate
  a free TLS certificate.

If you select a value other than `none`, then the `Ingress Hostname` field is
required: this is the hostname that you will use to access services (and
configure TLS for).

### Bring your own TLS certificate

For providing your own certificate, you select `tls_provide_certificate` from
the `Endpoint Protection` drop down and will need:

1. A TLS certificate and private key which need to be `base64` encoded and
  pasted into the Fortis wizard, shown below. Specifically, the `TLS
  Certificate` and `TLS Private Key` fields.

2. Access to your DNS server to point at the newly provisioned end point.
  This hostname you will need is that defined in the `FORTIS_DNS_NAME` tag (see
  below) and it will need to be pointed at the `FORTIS_DNS_IP` address. It
  should be noted that setting up a DNS A record will vary from provider to
  provider.

### LetsEncrypt free certificate

For enabling Let's Encrypt support, you select `tls_lets_encrypt` from the
`Endpoint Protection` dropdown and will need to provide the following:

1. The DNS name for inbound services. This is the `Ingress Hostname` field.

2. An email address that Let's Encrypt can verify the address portion of, for
  instance, if the email is admin@example.com, Let's Encrypt will attempt to
  verify `example.com`. This requires the configuration of either a DNS MX
  record or an A record. How to do this will vary by DNS provider. The value
  that Let's Encrypt will use is exposed in the `FORTIS_MX_RECORD` tag upon
  completion of deployment of Fortis. As an example, if you own the domain
  `test.com` and you are setting up your Fortis site at `fortis.test.com`,
  please ensure that the MX record for `fortis.test.com` is set to
  `fortis.test.com` and that the A record for `fortis.test.com` contains the
  value of the `FORTIS_DNS_IP` tag.

3. The Let's Encrypt address to use to request the certificate. Note that,
  the value defaults to the production server for Let's Encrypt. If you are a
  developer, change this value to `https://acme-staging.api.letsencrypt.org/directory`
  to speed up development.
